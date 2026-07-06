import React from 'react';
import { featuresData } from '../data/features';

export default function FeatureGrid() {
  return (
    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
      {/* Loop through the array using .map() */}
      {featuresData.map((feature) => (
        <div 
          key={feature.id} 
          className="bg-white p-6 rounded-3xl border-4 border-zinc-900 shadow-[6px_6px_0px_0px_#18181b] hover:-translate-y-1.5 transition-transform"
        >
          {/* Dynamic Background Color and Icon */}
          <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl border-3 border-zinc-900 flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#18181b] mb-4`}>
            {feature.icon}
          </div>
          
          {/* Dynamic Title and Description */}
          <h3 className="text-2xl font-black mb-2">{feature.title}</h3>
          <p className="text-zinc-600 font-medium">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}