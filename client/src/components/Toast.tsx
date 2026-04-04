export const Toast = ({ message, type }: { message: string | null; type: 'ok' | 'error' }) => {
  if (!message) {
    return null;
  }

  return <div className={`toast toast--${type}`}>{message}</div>;
};
