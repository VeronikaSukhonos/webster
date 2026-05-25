import { selectEditor } from '@store/editorSlice';

import { useAppSelector } from '@hooks/utilHooks';

import { capitalize } from '@utils/utils';

export const HistoryPanel = () => {
  const history = useAppSelector(selectEditor.history);

  return (
    <div className="col mini-gap">
      {history.map((h) => {
        return (
          <div>
            {capitalize(h.action)}{' '}
            {h.ids.length > 1
              ? `${h.ids.length} elements`
              : `a ${h.from?.[0].type || h.to?.[0].type}`}
          </div>
        );
      })}
    </div>
  );
};
