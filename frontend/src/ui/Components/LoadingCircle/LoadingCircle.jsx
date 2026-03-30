export default function LoadingCircle() {
  return (
    <div
      className="flex items-center justify-center w-full h-full"
    >
      <div
        className={`rounded-full h-12 w-12 border-4 border-solid border-t-transparent animate-spin`}
        style={{ borderColor: 'var(--main-hl) var(--main-hl) var(--main-hl) transparent' }}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};