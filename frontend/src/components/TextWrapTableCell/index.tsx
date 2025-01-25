export const TextWrapTableCell = ({ text }: { text: string }) => {
  return (
    <div
      style={{
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        overflow: 'hidden',
      }}
    >
      {text}
    </div>
  );
};
