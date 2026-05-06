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
  return (
    <div className="col grow all-center">
      <Error className="result-icon" />
      {reason.includes('not found') ? (
        <>
          <div style={errorHeader}>Nothing sketched here...</div>
          <div>This {entity} is not found</div>
        </>
      ) : (
        <>
          <div style={errorHeader}>
            A sudden stroke disrupted <span style={{ whiteSpace: 'nowrap' }}>the sketch...</span>
          </div>
          <div>{reason}</div>
        </>
      )}
    </div>
  );
};

export default ErrorPage;
