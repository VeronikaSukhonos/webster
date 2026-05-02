import { Logo, Spinner } from '@assets/index';

export const Load = ({ spinner = false }: { spinner?: boolean }) => {
  return (
    <div className="col grow all-center">
      {spinner ? <Spinner className="spinner" /> : <Logo className="load" />}
    </div>
  );
};
