export function loadMonaco() {

  return new Promise<void>((resolve) => {

    if ((window as any).monaco) {
      resolve();
      return;
    }

    const baseUrl = 'assets/monaco';

    const script = document.createElement('script');
    script.src = `${baseUrl}/vs/loader.js`;

    script.onload = () => {

      (window as any).require.config({
        paths: { vs: `${baseUrl}/vs` }
      });

      (window as any).require(['vs/editor/editor.main'], () => {
        resolve();
      });

    };

    document.body.appendChild(script);

  });

}
