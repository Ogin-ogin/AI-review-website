import React from 'react';

const ReviewVideoCard = ({ video, onClick }) => {
  return (
    <div
      className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(video.id)}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{video.title}</h3>
        <p className="text-gray-600">{video.channelName}</p>
        <p className="text-sm text-gray-500">{video.publishedAt}</p>
      </div>
    </div>
  );
};

export default ReviewVideoCard;