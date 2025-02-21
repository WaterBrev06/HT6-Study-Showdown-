import React from 'react';

const Leaderboard = ({ data }) => {
    return (
        <div className='w-full max-w-4xl mx-auto'>
            <table className='w-full border-separate border-spacing-0'>
                <thead>
                    <tr className='[filter:drop-shadow(2px_2px_0_black)]'>
                        <th className='px-6 py-3 text-left text-2xl font-brkreg text-stylized1 tracking-wider border-b-4 border-white'>Position</th>
                        <th className='px-6 py-3 text-left text-2xl font-brkreg text-stylized1 tracking-wider border-b-4 border-white'>Name / Email</th>
                        <th className='px-6 py-3 text-left text-2xl font-brkreg text-stylized1 tracking-wider border-b-4 border-white'>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index} 
                            className={`
                                backdrop-blur-sm 
                                ${index === 0 ? 'bg-yellow-500/20' : 
                                  index === 1 ? 'bg-gray-300/20' : 
                                  index === 2 ? 'bg-amber-700/20' : 'bg-white/5'}
                            `}>
                            <td className='px-6 py-4 border-b-2 border-white/30'>
                                <div className='text-2xl font-brkreg text-white [filter:drop-shadow(2px_2px_0_black)]'>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </div>
                            </td>
                            <td className='px-6 py-4 border-b-2 border-white/30'>
                                <div className='text-xl font-brkreg text-white [filter:drop-shadow(1px_1px_0_black)]'>{item.userName}</div>
                                <div className='text-sm text-white/80 font-custom'>{item.userEmail}</div>
                            </td>
                            <td className='px-6 py-4 border-b-2 border-white/30'>
                                <div className='text-xl font-brkreg text-white [filter:drop-shadow(1px_1px_0_black)]'>
                                    {item.recentScore.toLocaleString()}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
