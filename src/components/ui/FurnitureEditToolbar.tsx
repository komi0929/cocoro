/**
 * cocoro - FurnitureEditToolbar (Mobile-First)
 * Selected furniture editing controls
 */

import { useAjitStore } from '@/store/useAjitStore';

export function FurnitureEditToolbar() {
  const selectedId = useAjitStore(s => s.selectedFurnitureId);
  const rotateSelected90 = useAjitStore(s => s.rotateSelected90);
  const removeSelected = useAjitStore(s => s.removeSelected);
  const deselectFurniture = useAjitStore(s => s.deselectFurniture);

  if (!selectedId) return null;

  return (
    <div className="furniture-edit-toolbar">
      <div className="edit-toolbar-inner">
        <div className="edit-toolbar-actions">
          <button className="edit-btn" onClick={rotateSelected90} title="90\u00B0\u56DE\u8EE2">
            <span className="edit-btn-icon">{'\u{1F504}'}</span>
            <span className="edit-btn-label">{'\u56DE\u8EE2'}</span>
          </button>
          <button className="edit-btn edit-btn-danger" onClick={removeSelected} title="\u524A\u9664">
            <span className="edit-btn-icon">{'\u{1F5D1}\uFE0F'}</span>
            <span className="edit-btn-label">{'\u524A\u9664'}</span>
          </button>
          <button className="edit-btn" onClick={deselectFurniture} title="\u9589\u3058\u308B">
            <span className="edit-btn-icon">{'\u2716'}</span>
            <span className="edit-btn-label">{'\u9589\u3058\u308B'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
