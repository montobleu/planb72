// Markeert alinea's die beginnen met "Bron:" of "Bronnen:" (ook "Source :", "Quelle:", "Sources:") zodat ze klein en rustig getoond worden.
export default function rehypeBron() {
  return (tree) => {
    const bezoek = (node) => {
      if (node.type === 'element' && node.tagName === 'p') {
        const eerste = node.children?.[0];
        if (eerste?.type === 'text' && /^\s*(Bron(nen)?|Sources?|Quellen?)\s*:/.test(eerste.value)) {
          node.properties = { ...(node.properties || {}), className: ['bron-regel'] };
        }
      }
      node.children?.forEach(bezoek);
    };
    bezoek(tree);
  };
}
