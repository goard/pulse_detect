const Canvas = (props) => {
  const { elementRef, canvasWidth, canvasHeigth } = props;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <canvas
        ref={elementRef}
        width={canvasWidth}
        height={canvasHeigth}
      ></canvas>
      <p>Canvas</p>
    </div>
  );
};

export default Canvas;
