import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TreeNode {
  key: string;
  value: any;
  type: string;
  expanded: boolean;
  children?: TreeNode[];
}

@Component({
  selector: 'app-json-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree-view.html',
  styleUrl: './tree-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeView implements OnChanges {

  @Input({ required: true })
  jsonString = '';

  tree = signal<TreeNode[]>([]);


  ngOnChanges(): void {

    if (!this.jsonString) {
      this.tree.set([]);
      return;
    }

    try {

      const parsed = JSON.parse(this.jsonString);

      const nodes = this.buildTree('root', parsed);

      this.tree.set(nodes);

    } catch {
      this.tree.set([]);
    }

  }


  /* ===============================
     BUILD TREE
  =============================== */

  private buildTree(key: string, value: any): TreeNode[] {

    const type = this.getType(value);

    if (type === 'object' || type === 'array') {

      const children: TreeNode[] = [];

      if (type === 'object') {

        Object.keys(value).forEach(k => {
          children.push(...this.buildTree(k, value[k]));
        });

      } else {

        value.forEach((item: any, index: number) => {
          children.push(...this.buildTree(`[${index}]`, item));
        });

      }

      return [{
        key,
        value,
        type,
        expanded: true,
        children
      }];

    }

    return [{
      key,
      value,
      type,
      expanded: false
    }];

  }


  /* ===============================
     TYPE
  =============================== */

  private getType(value: any): string {

    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';

    return 'unknown';

  }


  /* ===============================
     TOGGLE
  =============================== */

  toggleNode(node: TreeNode): void {

    node.expanded = !node.expanded;

    this.tree.set([...this.tree()]);

  }


  /* ===============================
     EXPAND / COLLAPSE
  =============================== */

  expandAll(): void {

    this.setAllExpanded(this.tree(), true);

    this.tree.set([...this.tree()]);

  }


  collapseAll(): void {

    this.setAllExpanded(this.tree(), false);

    this.tree.set([...this.tree()]);

  }


  private setAllExpanded(nodes: TreeNode[], expanded: boolean): void {

    nodes.forEach(node => {

      node.expanded = expanded;

      if (node.children) {
        this.setAllExpanded(node.children, expanded);
      }

    });

  }


  /* ===============================
     FORMAT VALUE
  =============================== */

  formatValue(value: any, type: string): string {

    if (type === 'string') return `"${value}"`;
    if (type === 'null') return 'null';

    return String(value);

  }


  /* ===============================
     TRACKBY
  =============================== */

  trackByKey(_: number, node: TreeNode) {
    return node.key;
  }

}
