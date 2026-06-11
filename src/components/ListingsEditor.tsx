import type { Listing, RentalType } from '../types';

interface Props {
  listings: Listing[];
  onChange: (listings: Listing[]) => void;
}

const FIELDS: {
  key: keyof Listing;
  label: string;
  type: 'text' | 'number' | 'select';
}[] = [
  { key: 'name', label: '名称', type: 'text' },
  { key: 'rent', label: '月租(元)', type: 'number' },
  { key: 'type', label: '类型', type: 'select' },
  { key: 'commuteMinutes', label: '单程通勤(分)', type: 'number' },
  { key: 'dailyTransitCost', label: '每天交通费(元)', type: 'number' },
  { key: 'lighting', label: '采光(1-5)', type: 'number' },
  { key: 'area', label: '面积(m²)', type: 'number' },
];

export function makeBlankListing(): Listing {
  return {
    id: crypto.randomUUID(),
    name: '新房源',
    rent: 3000,
    type: '整租',
    commuteMinutes: 30,
    dailyTransitCost: 10,
    lighting: 3,
    area: 0,
  };
}

/** 表格式录入多套房源，支持增删改 */
export default function ListingsEditor({ listings, onChange }: Props) {
  function update(id: string, key: keyof Listing, value: string) {
    onChange(
      listings.map((l) => {
        if (l.id !== id) return l;
        if (key === 'name') return { ...l, name: value };
        if (key === 'type') return { ...l, type: value as RentalType };
        return { ...l, [key]: Number(value) };
      })
    );
  }

  function remove(id: string) {
    onChange(listings.filter((l) => l.id !== id));
  }

  return (
    <div className="card">
      <h2>③ 录入候选房源</h2>
      <p className="muted">把你在看的几套房填进来，至少 2 套才好对比。</p>
      <div className="table-scroll">
        <table className="listings-table">
          <thead>
            <tr>
              {FIELDS.map((f) => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id}>
                {FIELDS.map((f) => (
                  <td key={f.key}>
                    {f.type === 'select' ? (
                      <select
                        value={l.type}
                        onChange={(e) => update(l.id, f.key, e.target.value)}
                      >
                        <option value="整租">整租</option>
                        <option value="合租">合租</option>
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        value={l[f.key] as string | number}
                        onChange={(e) => update(l.id, f.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button className="btn-ghost" onClick={() => remove(l.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="btn-secondary"
        onClick={() => onChange([...listings, makeBlankListing()])}
      >
        + 添加一套房源
      </button>
    </div>
  );
}
