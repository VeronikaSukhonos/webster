import { setModal } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';

import { PlusIcon, TemplateIcon } from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import type { AuthUser } from '@mytypes/responseTypes';

const HomePageAuth = ({ auth }: { auth: AuthUser }) => {
  // TODO

  return (
    <>
      <h2 className="content-title t-art t-center">Recent Templates</h2>
      {/* TODO */}
      <h2 className="content-title t-art t-center">Recent Projects</h2>
      {/* TODO */}
    </>
  );
};

const HomePageGuest = () => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className="box pd-box t-center">
        <p style={{ lineHeight: '150%' }}>
          <span className="app-name">
            Sket<span>Cherry</span>
          </span>{' '}
          is a simple online graphic editor that empowers anyone
          <span
            style={{
              color: 'var(--dark-blue)',
              display: 'block',
              fontWeight: 'bold',
              fontStyle: 'italic',
            }}
          >
            – regardless of design experience –
          </span>
          to effortlessly create stunning visuals
        </p>
      </div>
      <div className="row all-center" style={{ width: '340px', maxWidth: '100%' }}>
        <MainButton
          content={
            <>
              <PlusIcon />
              Create
            </>
          }
          onClick={() => dispatch(setModal({ type: 'createProject' }))}
          upperText
          style={{ flex: 1 }}
        />
        <MainButton
          content={
            <>
              <TemplateIcon />
              Templates
            </>
          }
          to="/templates"
          color="white"
          upperText
          style={{ flex: 1 }}
        />
      </div>
    </>
  );
};

const HomePage = () => {
  const auth = useAuth();

  return (
    <div className="col grow all-center">
      <h1 className="slogan t-art t-center">
        Everyone can make art!
        <br />
        Right now!
      </h1>
      {auth ? <HomePageAuth auth={auth} /> : <HomePageGuest />}
    </div>
  );
};

export default HomePage;
