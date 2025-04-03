import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">プライバシーポリシー</h1>
      <p className="mb-4">
        当サイトは、ユーザーのプライバシーを尊重し、個人情報を適切に保護することをお約束します。
      </p>
      <h2 className="text-xl font-semibold mb-2">収集する情報</h2>
      <p className="mb-4">
        当サイトでは、サービス提供のために必要な範囲で個人情報を収集する場合があります。
      </p>
      <h2 className="text-xl font-semibold mb-2">情報の利用目的</h2>
      <p className="mb-4">
        収集した情報は、サービスの改善やユーザーサポートの提供に使用されます。
      </p>
      <h2 className="text-xl font-semibold mb-2">お問い合わせ</h2>
      <p>
        プライバシーポリシーに関するお問い合わせは、当サイトのサポートまでご連絡ください。
      </p>
    </div>
  );
};

export default PrivacyPolicy;