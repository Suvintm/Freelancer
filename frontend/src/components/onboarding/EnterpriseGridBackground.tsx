import React from 'react';

export const EnterpriseGridBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #18181b 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-zinc-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-zinc-200/30 rounded-full blur-3xl" />
    </div>
  );
};
