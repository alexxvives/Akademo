// Type declaration for Lordicon custom element
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          trigger?: string;
          colors?: string;
          target?: string;
        },
        HTMLElement
      >;
    }
  }
}
