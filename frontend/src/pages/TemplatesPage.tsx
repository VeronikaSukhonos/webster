import { useEffect, useState } from 'react';

import TemplatesApi from '@api/templatesApi';

import { selectUi, setTemplateToDelete, setTemplateToUpdate } from '@store/uiSlice';

import { SelectField, SelectLabel, TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Pagination } from '@components/Pagination';
import { ProjectList } from '@components/projects/ProjectList';

import { SearchIcon } from '@assets/index';

import {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useFeedback,
  usePage,
  useTotal,
} from '@hooks/utilHooks';

import { DEFAULT_PROJECT_LIST_LIMIT, TEMPLATE_TYPES } from '@utils/constants';

import { type TemplateResponse, type TemplateType } from '@mytypes/responseTypes';

const TemplatesPage = () => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const [areTemplatesLoading, setAreTemplatesLoading] = useState(false);
  const [templatesFeedback, setTemplatesFeedback] = useFeedback();
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);

  const { searchParams, setSearchParams, getPage } = usePage();
  const [search, setSearch] = useState(searchParams.get('search') ?? undefined);
  const [templateType, setTemplateType] = useState<TemplateType | 'all'>(
    ((searchParams.get('type') ?? searchParams.get('templateType')) as TemplateType | undefined) ??
      ('all' as const),
  );
  const [source, setSource] = useState(searchParams.get('source') ?? 'all');
  const { total, setTotal } = useTotal();

  const templateToUpdate = useAppSelector(selectUi.templateToUpdate);
  const templateToDelete = useAppSelector(selectUi.templateToDelete);
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const templateTypes = [
    {
      value: 'all',
      label: <SelectLabel>All types</SelectLabel>,
    },
  ];
  for (const i of TEMPLATE_TYPES) {
    templateTypes.push({
      value: i.value,
      label: <SelectLabel>{i.label}</SelectLabel>,
    });
  }

  const searchTemplates = async function (e: React.SubmitEvent) {
    e.preventDefault();
    setSearchParams({
      ...(search && { search }),
      ...(templateType !== 'all' && { type: templateType }),
      ...(source && { source }),
    });
    setShouldRefetch(true);
  };

  useEffect(() => {
    if (templateToUpdate || templateToDelete) {
      setSearch('');
      setSearchParams({});
      setShouldRefetch(true);
    }
  }, [templateToUpdate, templateToDelete]);

  useEffect(() => {
    if (!shouldRefetch) setShouldRefetch(true);
  }, [searchParams]);

  useEffect(() => {
    if (!shouldRefetch) return;
    setAreTemplatesLoading(true);
    TemplatesApi.getTemplates({
      page: getPage(),
      limit: DEFAULT_PROJECT_LIST_LIMIT,
      search,
      type: templateType === 'all' ? undefined : templateType,
      source: source as 'custom' | 'all' | 'built-in' | undefined,
    })
      .then(({ data: res }) => {
        setAreTemplatesLoading(false);
        setTemplatesFeedback(res.message, 'ok');
        setTemplates(res.data.templates);
        setTotal(res.data.pagination.total, res.data.pagination.limit);
      })
      .catch((err) => {
        setAreTemplatesLoading(false);
        setTemplatesFeedback(err.message, 'fail');
        setTemplates([]);
        setTotal();
      })
      .finally(() => {
        dispatch(setTemplateToUpdate(null));
        dispatch(setTemplateToDelete(null));
        setShouldRefetch(false);
      });
  }, [searchParams, shouldRefetch]);

  useEffect(() => {
    return () => {
      dispatch(setTemplateToUpdate(null));
      dispatch(setTemplateToDelete(null));
    };
  }, []);

  return (
    <div className="col hor-center grow">
      <h1 className="slogan t-art t-center">Templates</h1>
      <form
        onSubmit={searchTemplates}
        style={{ display: 'flex', flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}
      >
        <TextField
          name="search"
          value={search}
          onChange={(e /*: ChangeEvent<HTMLInputElement>*/) =>
            setSearch(e.target.value === '' ? undefined : e.target.value)
          }
          placeholder="Search template..."
          disabled={areTemplatesLoading}
        />
        <MainButton type="submit" color="white" disabled={areTemplatesLoading}>
          <SearchIcon />
        </MainButton>
        <SelectField
          name="type"
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          options={templateTypes}
          style={{ width: 155 }}
        />
      </form>
      {auth && (
        <div className="row all-center" style={{ width: '340px', maxWidth: '100%', gap: 10 }}>
          <MainButton
            onClick={() => setSource(source === 'built-in' ? 'all' : 'built-in')}
            color={source === 'built-in' ? 'purple' : 'white'}
            style={{ flex: 1 }}
          >
            Built-In
          </MainButton>
          <MainButton
            onClick={() => setSource(source === 'custom' ? 'all' : 'custom')}
            color={source === 'custom' ? 'purple' : 'white'}
            style={{ flex: 1 }}
          >
            Custom
          </MainButton>
        </div>
      )}
      <ProjectList
        templates={templates}
        areProjectsLoading={areTemplatesLoading}
        projectsFeedback={templatesFeedback}
        noDataFeedback="No templates yet"
      />
      <Pagination totalPages={total.totalPages} disabled={areTemplatesLoading} />
    </div>
  );
};

export default TemplatesPage;
