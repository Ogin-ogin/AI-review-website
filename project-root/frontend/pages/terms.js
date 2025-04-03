import React from 'react';

const Terms = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">利用規約</h1>
      <p className="mb-4">
        この利用規約（以下、「本規約」といいます。）は、当サイトの利用条件を定めるものです。
        ユーザーの皆様には、本規約に従って当サイトをご利用いただきます。
      </p>
      <h2 className="text-xl font-semibold mb-2">第1条（適用）</h2>
      <p className="mb-4">
        本規約は、ユーザーと当サイト運営者との間の本サービスの利用に関わる一切の関係に適用されます。
      </p>
      <h2 className="text-xl font-semibold mb-2">第2条（禁止事項）</h2>
      <p className="mb-4">
        ユーザーは、以下の行為を行ってはなりません。
        <ul className="list-disc list-inside">
          <li>法令または公序良俗に違反する行為</li>
          <li>当サイトの運営を妨害する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </p>
      <h2 className="text-xl font-semibold mb-2">第3条（免責事項）</h2>
      <p className="mb-4">
        当サイトの利用に関連して生じた損害について、運営者は一切の責任を負いません。
      </p>
      <h2 className="text-xl font-semibold mb-2">お問い合わせ</h2>
      <p>
        本規約に関するお問い合わせは、当サイトのサポートまでご連絡ください。
      </p>
    </div>
  );
};

export default Terms;