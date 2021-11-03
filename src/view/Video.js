const Video = (props) => {
  const { elementRef, videoWidth, videoHeigth, onCanPlay } = props;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <video
        ref={elementRef}
        width={videoWidth}
        height={videoHeigth}
        onCanPlay={onCanPlay}
      ></video>
      <p>Video</p>
    </div>
  );
};

export default Video;
