import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all">
      <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/40 p-3 inline-block rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-indigo-900 dark:text-indigo-300">{title}</h3>
      <p className="text-indigo-800 dark:text-indigo-200">{description}</p>
    </div>
  );
}
