import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Load } from '@components/Load';

import { Error } from '@assets/index';

interface ErrorPageProps {
  reason?: string;
  entity?: 'page' | 'user' | 'project' | 'template';
}

const errorHeader: React.CSSProperties = {
  fontSize: '1.7rem',
  fontWeight: 'bold',
  textAlign: 'center',
};

const ErrorPage = ({ reason = 'not found', entity = 'page' }: ErrorPageProps) => {
  const navigate = useNavigate();
  const hasToasted = useRef(false);

  useEffect(() => {
    if (!reason.includes('log in') || hasToasted.current) return;
    hasToasted.current = true;

    toast(reason);
    navigate('/login');
  }, []);

  if (reason.includes('log in')) return <Load spinner />;

  return (
    <div className="col grow all-center">
      <Error className="result-icon" />
      {reason.includes('not found') ? (
        <>
          <div style={errorHeader}>Nothing sketched here...</div>
          <div className="t-center">This {entity} is not found</div>
        </>
      ) : (
        <>
          <div style={errorHeader}>
            A sudden stroke disrupted <span style={{ whiteSpace: 'nowrap' }}>the sketch...</span>
          </div>
          <div className="t-center">{reason}</div>
        </>
      )}
    </div>
  );
};

export default ErrorPage;
