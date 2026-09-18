import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const RepeatableFieldList = ({
  items = [],
  onChange,
  onAddItem,
  renderItem,
  addButtonText = "+ Add Item",
  minItems = 0
}) => {
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    onChange(newItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    onChange(newItems);
  };

  const handleDelete = (index) => {
    if (items.length <= minItems) {
      alert(`Minimum ${minItems} item(s) required!`);
      return;
    }
    const newItems = items.filter((_, idx) => idx !== index);
    onChange(newItems);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => (
        <div 
          key={index}
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            minWidth: 0
          }}
        >
          {/* MOVE REORDER BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
              title="Move Up"
              style={{
                background: index === 0 ? '#f1f5f9' : '#e0f2fe',
                color: index === 0 ? '#cbd5e1' : '#0284c7',
                border: 'none',
                width: '24px',
                height: '24px',
                borderRadius: '5px',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleMoveDown(index)}
              disabled={index === items.length - 1}
              title="Move Down"
              style={{
                background: index === items.length - 1 ? '#f1f5f9' : '#e0f2fe',
                color: index === items.length - 1 ? '#cbd5e1' : '#0284c7',
                border: 'none',
                width: '24px',
                height: '24px',
                borderRadius: '5px',
                cursor: index === items.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowDown size={13} />
            </button>
          </div>

          {/* ITEM CONTENT CONTAINER WITH minWidth: 0 TO PREVENT OVERFLOW */}
          <div style={{ flex: '1 1 0%', minWidth: 0 }}>
            {renderItem(item, index)}
          </div>

          {/* DELETE BUTTON */}
          <button
            type="button"
            onClick={() => handleDelete(index)}
            title="Delete Item"
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {/* ADD NEW ITEM BUTTON */}
      <button
        type="button"
        onClick={onAddItem}
        style={{
          background: '#f0fdf4',
          color: '#16a34a',
          border: '1.5px dashed #bbf7d0',
          padding: '10px',
          borderRadius: '10px',
          fontWeight: '700',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '4px'
        }}
      >
        <Plus size={16} /> {addButtonText}
      </button>
    </div>
  );
};

export default RepeatableFieldList;
