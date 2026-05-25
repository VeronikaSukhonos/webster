import { selectEditor, setHistoryTarget } from '@store/editorSlice';

import { Menu, MenuItem } from '@components/Menu';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { capitalize } from '@utils/utils';

export const HistoryPanel = () => {
  const dispatch = useAppDispatch();

  const history = useAppSelector(selectEditor.history);
  const historyTarget = useAppSelector(selectEditor.historyTarget);

  return (
    <Menu>
      {history.map((h, i) => {
        return (
          <MenuItem
            key={i}
            style={
              historyTarget === i
                ? { background: 'var(--transparent-light-blue)', color: 'var(--dark-blue)' }
                : { fontWeight: 500 }
            }
            onAction={() => dispatch(setHistoryTarget(i))}
          >
            {capitalize(h.action)}{' '}
            {h.ids.length > 1
              ? `${h.ids.length} elements`
              : `a ${h.from?.[0].type || h.to?.[0].type}`}
          </MenuItem>
        );
      })}
    </Menu>
  );
};
