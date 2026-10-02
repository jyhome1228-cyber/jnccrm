(() => {
  function clean(value) {
    return String(value || '').replace(/\s+/g,' ').trim();
  }

  function groupTextItems(items, options = {}) {
    const rowTolerance = Number(options.rowTolerance || 2.2);
    const columnGap = Number(options.columnGap || 80);

    const normalized = (items || [])
      .map((item,index) => ({
        text:clean(item.text != null ? item.text : item.str),
        x:Number(item.x != null ? item.x : item.transform && item.transform[4]) || 0,
        y:Number(item.y != null ? item.y : item.transform && item.transform[5]) || 0,
        index:item.index != null ? item.index : index
      }))
      .filter(item => item.text);

    const sorted = normalized.slice().sort((a,b) => {
      if (Math.abs(a.y - b.y) > rowTolerance) return a.y - b.y;
      if (Math.abs(a.x - b.x) > 0.5) return a.x - b.x;
      return a.index - b.index;
    });

    const rows = [];
    for (const item of sorted) {
      let row = rows.find(r => Math.abs(r.y - item.y) <= rowTolerance);
      if (!row) {
        row = {y:item.y,items:[]};
        rows.push(row);
      }
      row.items.push(item);
    }

    rows.sort((a,b) => a.y - b.y);

    const lines = rows.map(row => {
      const rowItems = row.items.sort((a,b) => a.x - b.x || a.index - b.index);
      const cells = [];
      let current = '';
      let previousStartX = null;

      for (const item of rowItems) {
        const startDelta = previousStartX == null ? 0 : item.x - previousStartX;
        const startsNewColumn = Boolean(current) && startDelta >= columnGap;

        if (startsNewColumn) {
          cells.push(current.trim());
          current = item.text;
        } else {
          current = (current ? current + ' ' : '') + item.text;
        }
        previousStartX = item.x;
      }

      if (current.trim()) cells.push(current.trim());
      return cells;
    }).filter(cells => cells.length);

    return {
      rows,
      cells:lines,
      text:lines.map(cells => cells.join('\t')).join('\n')
    };
  }

  const api = { groupTextItems };
  globalThis.JNCRequestPdfLayout = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();