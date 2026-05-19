import { useEffect, useState } from 'react';

import TemplatesApi from '@api/templatesApi';

import { SelectField, SelectLabel, TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Pagination } from '@components/Pagination';
import { ProjectList } from '@components/projects/ProjectList';

import { SearchIcon } from '@assets/index';

import { useAuth, useFeedback, usePage, useTotal } from '@hooks/utilHooks';

import { DEFAULT_PROJECT_LIST_LIMIT, TEMPLATE_TYPES } from '@utils/constants';

import type { TemplateResponse } from '@mytypes/responseTypes';

const TemplatesPage = () => {
  const auth = useAuth();
  const [areTemplatesLoading, setAreTemplatesLoading] = useState(false);
  const [templatesFeedback, setTemplatesFeedback] = useFeedback();
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const { getPage } = usePage();
  const [search, setSearch] = useState(undefined);
  const [templateType, setTemplateType] = useState(undefined);
  const [source, setSource] = useState('all');
  const { total, setTotal } = useTotal();
  const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };
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
    setAreTemplatesLoading(true);
    TemplatesApi.getTemplates({
      page: pagination.page,
      limit: pagination.limit,
      search: search,
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
      });
  };
  useEffect(() => {
    setAreTemplatesLoading(true);
    TemplatesApi.getTemplates(pagination)
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
      });
  }, []);
  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
      <h1 className="slogan t-art t-center">Templates</h1>
      <form
        onSubmit={searchTemplates}
        style={{ display: 'flex', flexDirection: 'row', gap: 5 + 'px', marginBottom: 10 + 'px' }}
      >
        <TextField
          name="search"
          value={search}
          onChange={(e /*: ChangeEvent<HTMLInputElement>*/) =>
            setSearch(e.target.value === '' ? undefined : e.target.value)
          }
          placeholder="Search template..."
        />
        <MainButton type="submit" color="white">
          <SearchIcon />
        </MainButton>
        <SelectField
          name="templateType"
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          options={templateTypes}
        />
      </form>
      {auth && (
        <div
          style={{ display: 'flex', flexDirection: 'row', gap: 5 + 'px', marginBottom: 10 + 'px' }}
        >
          <MainButton
            onClick={() => setSource(source === 'built-in' ? 'all' : 'built-in')}
            color={source === 'built-in' ? 'purple' : 'white'}
          >
            Built-In
          </MainButton>
          <MainButton
            onClick={() => setSource(source === 'custom' ? 'all' : 'custom')}
            color={source === 'custom' ? 'purple' : 'white'}
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
