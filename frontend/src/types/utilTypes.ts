export interface Feedback {
  message: string;
  status: 'ok' | 'fail' | '';
}

export interface FakeEvent {
  target: {
    name: string;
    value: any;
  };
}
