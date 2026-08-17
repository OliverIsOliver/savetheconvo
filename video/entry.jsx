import React from "react";
import { Composition, registerRoot } from "remotion";
import { SaveTheConvoVideo } from "./SaveTheConvoVideo.jsx";

const defaultProps = {
  person: {
    id: "tiffany.lane",
    name: "Tiffany",
    handle: "tiffany.lane",
    initials: "T",
    avatarSrc: null
  },
  conversation: [],
  durationInFrames: 90
};

export function RemotionRoot() {
  return (
    <Composition
      id="SaveTheConvoVideo"
      component={SaveTheConvoVideo}
      width={390}
      height={844}
      fps={30}
      durationInFrames={90}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(1, Number(props.durationInFrames || 90))
      })}
    />
  );
}

registerRoot(RemotionRoot);
