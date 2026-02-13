import { Injectable } from '@angular/core';

/**
 * Self-contained JMESPath engine — no external npm packages.
 * Supports: identifiers, sub-expressions, indexes, wildcards [*] .* ,
 * multi-select list/hash, filter projections [?cond], pipe |,
 * comparisons (==, !=, <, >, <=, >=), logical (&&, ||, !),
 * literals (`…`), and built-in functions:
 *   keys, values, length, type, to_string, to_number, not_null,
 *   contains, starts_with, ends_with, reverse, sort, sort_by,
 *   min, max, min_by, max_by, sum, avg, floor, ceil, abs,
 *   merge, flatten, join, split, trim, upper, lower
 */
@Injectable({ providedIn: 'root' })
export class JmespathService {

  search(data: any, expression: string): any {
    const tokens = this.tokenize(expression.trim());
    const node   = this.parse(tokens);
    return this.evaluate(node, data);
  }

  /* ── Tokeniser ── */
  private tokenize(expr: string): string[] {
    const t: string[] = [];
    let i = 0;
    while (i < expr.length) {
      if (/\s/.test(expr[i])) { i++; continue; }
      if (expr[i] === '`') {
        let j = i + 1; while (j < expr.length && expr[j] !== '`') j++;
        t.push(expr.slice(i, j + 1)); i = j + 1; continue;
      }
      if (expr[i] === "'") {
        let j = i + 1; while (j < expr.length && expr[j] !== "'") j++;
        t.push(expr.slice(i, j + 1)); i = j + 1; continue;
      }
      if (expr[i] === '"') {
        let j = i + 1; while (j < expr.length && expr[j] !== '"') j++;
        t.push(expr.slice(i, j + 1)); i = j + 1; continue;
      }
      if (i + 1 < expr.length) {
        const two = expr.slice(i, i + 2);
        if (['==','!=','<=','>=','&&','||'].includes(two)) { t.push(two); i += 2; continue; }
      }
      if ('[](){}.,|!<>&*@:-'.includes(expr[i])) { t.push(expr[i++]); continue; }
      let j = i; while (j < expr.length && /[\w$]/.test(expr[j])) j++;
      if (j > i) { t.push(expr.slice(i, j)); i = j; continue; }
      i++;
    }
    return t;
  }

  /* ── Parser ── */
  private pos = 0; private toks: string[] = [];
  private parse(tokens: string[]): any { this.toks = tokens; this.pos = 0; return this.parseExpr(); }
  private peek(d = 0) { return this.toks[this.pos + d]; }
  private consume() { return this.toks[this.pos++]; }
  private expect(x: string) { const v = this.consume(); if (v !== x) throw new Error(`Expected "${x}" got "${v}"`); }

  private parseExpr(): any  { return this.parsePipe(); }
  private parsePipe(): any  { let n = this.parseOr(); while (this.peek()==='|') { this.consume(); n = {type:'pipe',left:n,right:this.parseOr()}; } return n; }
  private parseOr(): any    { let n = this.parseAnd(); while (this.peek()==='||') { this.consume(); n = {type:'or',left:n,right:this.parseAnd()}; } return n; }
  private parseAnd(): any   { let n = this.parseCmp(); while (this.peek()==='&&') { this.consume(); n = {type:'and',left:n,right:this.parseCmp()}; } return n; }
  private parseCmp(): any {
    let n = this.parseUnary();
    while (['==','!=','<','>','<=','>='].includes(this.peek())) {
      const op = this.consume(); n = {type:'compare',op,left:n,right:this.parseUnary()};
    }
    return n;
  }
  private parseUnary(): any { if (this.peek()==='!') { this.consume(); return {type:'not',expr:this.parseProj()}; } return this.parseProj(); }

  private parseProj(): any {
    let n = this.parsePrimary();
    while (true) {
      const t = this.peek();
      if (t === '.') {
        this.consume();
        if (this.peek() === '*') { this.consume(); n = {type:'valproj',expr:n}; }
        else n = {type:'sub',left:n,right:this.parsePrimary()};
      } else if (t === '[') {
        const t2 = this.peek(1);
        if (t2 === '*') { this.consume(); this.consume(); this.expect(']'); n = {type:'wild',expr:n}; }
        else if (t2 === '?') { this.consume(); this.consume(); const c = this.parseExpr(); this.expect(']'); n = {type:'filter',expr:n,cond:c}; }
        else if (t2 === ']') { this.consume(); this.consume(); n = {type:'flat',expr:n}; }
        else { this.consume(); const idx = this.consume(); this.expect(']'); n = {type:'idx',expr:n,index:Number(idx)}; }
      } else break;
    }
    return n;
  }

  private parsePrimary(): any {
    const t = this.peek();
    if (t === '@') { this.consume(); return {type:'cur'}; }
    if (t?.startsWith('`')) {
      this.consume(); const inner = t.slice(1,-1);
      try { return {type:'lit',value:JSON.parse(inner)}; } catch { return {type:'lit',value:inner}; }
    }
    if (t?.startsWith("'")) { this.consume(); return {type:'lit',value:t.slice(1,-1)}; }
    if (t?.startsWith('"')) { this.consume(); return {type:'id',name:t.slice(1,-1)}; }
    if (t==='-' && /^\d+$/.test(this.peek(1)||'')) { this.consume(); return {type:'lit',value:-Number(this.consume())}; }
    if (t!==undefined && /^\d+$/.test(t)) { this.consume(); return {type:'lit',value:Number(t)}; }
    if (t && /^[a-zA-Z_]/.test(t) && this.peek(1)==='(') {
      const name = this.consume(); this.expect('(');
      const args: any[] = [];
      while (this.peek()!==')' && this.peek()!==undefined) { if (args.length) this.expect(','); args.push(this.parseExpr()); }
      this.expect(')'); return {type:'fn',name,args};
    }
    if (t==='[' && this.peek(1)!==']' && this.peek(1)!=='?' && this.peek(1)!=='*' && !/^-?\d+$/.test(this.peek(1)||'')) {
      this.consume(); const items: any[] = [];
      while (this.peek()!==']') { if (items.length) this.expect(','); items.push(this.parseExpr()); }
      this.expect(']'); return {type:'mlist',items};
    }
    if (t==='{') {
      this.consume(); const fields: any[] = [];
      while (this.peek()!=='}') { if (fields.length) this.expect(','); const k = this.consume(); this.expect(':'); fields.push({k,e:this.parseExpr()}); }
      this.expect('}'); return {type:'mhash',fields};
    }
    if (t!==undefined && /^[a-zA-Z_$][\w$]*$/.test(t)) { this.consume(); return {type:'id',name:t}; }
    if (t==='*') { this.consume(); return {type:'cur'}; }
    throw new Error(`Unexpected token: "${t}"`);
  }

  /* ── Evaluator ── */
  private evaluate(node: any, data: any): any {
    switch (node?.type) {
      case 'cur':    return data;
      case 'lit':    return node.value;
      case 'id':     return data==null||typeof data!=='object' ? null : data[node.name]??null;
      case 'sub':    return this.evaluate(node.right, this.evaluate(node.left, data));
      case 'pipe':   return this.evaluate(node.right, this.evaluate(node.left, data));
      case 'idx': {  const a = this.evaluate(node.expr,data); if (!Array.isArray(a)) return null; const i = node.index<0?a.length+node.index:node.index; return a[i]??null; }
      case 'wild': { const s = this.evaluate(node.expr,data); return Array.isArray(s)?s : s&&typeof s==='object'?Object.values(s):null; }
      case 'valproj':{ const s = this.evaluate(node.expr,data); return s&&typeof s==='object'&&!Array.isArray(s)?Object.values(s):null; }
      case 'flat': { const s = this.evaluate(node.expr,data); return Array.isArray(s)?s.flat():null; }
      case 'filter': { const src = this.evaluate(node.expr,data); const arr = Array.isArray(src)?src:src!=null?[src]:[]; return arr.filter((item:any)=>this.truthy(this.evaluate(node.cond,item))); }
      case 'mlist':  return node.items.map((x:any)=>this.evaluate(x,data));
      case 'mhash':  { const o:any={}; for (const f of node.fields) o[f.k]=this.evaluate(f.e,data); return o; }
      case 'compare': { const l=this.evaluate(node.left,data),r=this.evaluate(node.right,data); switch(node.op){ case'==':return this.deq(l,r); case'!=':return !this.deq(l,r); case'<':return l<r; case'>':return l>r; case'<=':return l<=r; case'>=':return l>=r; } return false; }
      case 'or':  return this.truthy(this.evaluate(node.left,data)) ? this.evaluate(node.left,data) : this.evaluate(node.right,data);
      case 'and': return !this.truthy(this.evaluate(node.left,data)) ? this.evaluate(node.left,data) : this.evaluate(node.right,data);
      case 'not': return !this.truthy(this.evaluate(node.expr,data));
      case 'fn':  return this.fn(node.name, node.args, data);
      default: throw new Error(`Unknown AST node: ${node?.type}`);
    }
  }

  private truthy(v: any): boolean {
    if (v===null||v===undefined||v===false) return false;
    if (typeof v==='string' && v==='') return false;
    if (Array.isArray(v) && v.length===0) return false;
    if (typeof v==='object' && !Array.isArray(v) && Object.keys(v).length===0) return false;
    return true;
  }
  private deq(a: any, b: any): boolean { return JSON.stringify(a)===JSON.stringify(b); }

  /* ── Functions ── */
  private fn(name: string, argNodes: any[], data: any): any {
    const ev = (n: any) => this.evaluate(n, data);
    const a0 = argNodes[0] ? ev(argNodes[0]) : undefined;
    const a1 = argNodes[1] ? ev(argNodes[1]) : undefined;

    switch (name) {
      case 'keys':        return a0!=null&&typeof a0==='object'?Object.keys(a0):null;
      case 'values':      return a0!=null&&typeof a0==='object'?Object.values(a0):null;
      case 'length':      return a0==null?null:Array.isArray(a0)?a0.length:typeof a0==='string'?a0.length:typeof a0==='object'?Object.keys(a0).length:null;
      case 'type':        return a0===null?'null':Array.isArray(a0)?'array':typeof a0;
      case 'to_string':   return JSON.stringify(a0);
      case 'to_number':   return Number(a0);
      case 'not_null':    return argNodes.map(ev).find((v:any)=>v!==null)??null;
      case 'contains':    return Array.isArray(a0)?a0.some((i:any)=>this.deq(i,a1)):typeof a0==='string'?a0.includes(String(a1)):false;
      case 'starts_with': return typeof a0==='string'&&typeof a1==='string'?a0.startsWith(a1):false;
      case 'ends_with':   return typeof a0==='string'&&typeof a1==='string'?a0.endsWith(a1):false;
      case 'reverse':     return Array.isArray(a0)?[...a0].reverse():typeof a0==='string'?a0.split('').reverse().join(''):null;
      case 'sort':        return Array.isArray(a0)?[...a0].sort((x:any,y:any)=>x<y?-1:x>y?1:0):null;
      case 'sort_by': {
        if (!Array.isArray(a0)||!argNodes[1]) return null;
        const kf = (item:any) => this.evaluate(argNodes[1],item);
        return [...a0].sort((x:any,y:any)=>{const kx=kf(x),ky=kf(y);return kx<ky?-1:kx>ky?1:0;});
      }
      case 'min':         return Array.isArray(a0)&&a0.length?Math.min(...a0):null;
      case 'max':         return Array.isArray(a0)&&a0.length?Math.max(...a0):null;
      case 'min_by': {    if (!Array.isArray(a0)||!argNodes[1]) return null; const kf=(i:any)=>this.evaluate(argNodes[1],i); return a0.reduce((m:any,i:any)=>kf(i)<kf(m)?i:m,a0[0]); }
      case 'max_by': {    if (!Array.isArray(a0)||!argNodes[1]) return null; const kf=(i:any)=>this.evaluate(argNodes[1],i); return a0.reduce((m:any,i:any)=>kf(i)>kf(m)?i:m,a0[0]); }
      case 'sum':         return Array.isArray(a0)?a0.reduce((s:number,v:any)=>s+Number(v),0):null;
      case 'avg':         return Array.isArray(a0)&&a0.length?a0.reduce((s:number,v:any)=>s+Number(v),0)/a0.length:null;
      case 'floor':       return typeof a0==='number'?Math.floor(a0):null;
      case 'ceil':        return typeof a0==='number'?Math.ceil(a0):null;
      case 'abs':         return typeof a0==='number'?Math.abs(a0):null;
      case 'merge':       return argNodes.map(ev).reduce((acc:any,o:any)=>({...acc,...o}),{});
      case 'flatten':     return Array.isArray(a0)?a0.flat(Infinity):null;
      case 'join':        return Array.isArray(a1)?a1.join(String(a0)):null;
      case 'split':       return typeof a0==='string'&&typeof a1==='string'?a1.split(a0):null;
      case 'trim':        return typeof a0==='string'?a0.trim():null;
      case 'upper':       return typeof a0==='string'?a0.toUpperCase():null;
      case 'lower':       return typeof a0==='string'?a0.toLowerCase():null;
      default: throw new Error(`Unknown function: ${name}()`);
    }
  }
}
