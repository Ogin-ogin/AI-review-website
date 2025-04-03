import React from 'react';

export default function HeroSection() {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>AIレビュー動画分析サイト</h1>
        <p>
          AIを活用して製品レビュー動画を分析し、最適な製品選びをサポートします。
        </p>
        <a href="#categories" className="hero-button">
          カテゴリを見る
        </a>
      </div>
      <div className="hero-image">
        <img src="/hero-image.jpg" alt="AIレビュー動画分析" />
      </div>
    </div>
  );
}