import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const COLORS = {
  ink: "#141414",
  muted: "#8d8d8b",
  softMuted: "#b2b2af",
  line: "#e9e9e6",
  canvas: "#ffffff",
  bubble: "#f0f0ee",
  accent: "#7138ff"
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

function Avatar({ person, size = 36 }) {
  const style = {
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    width: size,
    height: size,
    overflow: "hidden",
    borderRadius: "50%",
    color: "#552f50",
    background: "linear-gradient(135deg, #f4c4d6, #bd7fba)",
    fontSize: Math.max(8, Math.round(size * 0.32)),
    fontWeight: 700
  };

  return (
    <div style={style}>
      {person.avatarSrc ? <Img src={person.avatarSrc} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "51% 43%" }} /> : person.initials}
    </div>
  );
}

function Header({ person }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, flex: "0 0 72px", padding: "0 12px", borderBottom: `1px solid ${COLORS.line}`, background: "rgba(255, 255, 255, .55)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Avatar person={person} />
        <div>
          <div style={{ color: COLORS.ink, fontSize: 14, fontWeight: 700 }}>{person.name}</div>
          <div style={{ marginTop: 3, color: COLORS.muted, fontSize: 10 }}>{person.handle}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: COLORS.ink }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.227 22.912c-4.913 0-9.286-3.627-11.486-5.828C4.486 14.83.731 10.291.921 5.231a3.289 3.289 0 0 1 .908-2.138 17.116 17.116 0 0 1 1.865-1.71 2.307 2.307 0 0 1 3.004.174 13.283 13.283 0 0 1 3.658 5.325 2.551 2.551 0 0 1-.19 1.941l-.455.853a.463.463 0 0 0-.024.387 7.57 7.57 0 0 0 4.077 4.075.455.455 0 0 0 .386-.024l.853-.455a2.548 2.548 0 0 1 1.94-.19 13.278 13.278 0 0 1 5.326 3.658 2.309 2.309 0 0 1 .174 3.003 17.319 17.319 0 0 1-1.71 1.866 3.29 3.29 0 0 1-2.138.91 10.27 10.27 0 0 1-.368.006Z" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="5" width="15" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="m17.999 9.146 2.495-2.256A1.5 1.5 0 0 1 23 8.003v7.994a1.5 1.5 0 0 1-2.506 1.113L18 14.854" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10.5" stroke="currentColor" />
          <circle cx="12" cy="7.7" r="1.25" fill="currentColor" />
          <path d="M10.6 16.8h2.8M12 11.05v5.7h-1.4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function MessageRow({ event, person, frame, fps }) {
  const eventFrame = (event.timestampMs / 1_000) * fps;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: event.side === "me" ? "flex-end" : "flex-start", gap: 9, margin: "14px 0", opacity: interpolate(frame, [eventFrame, eventFrame + 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: `0px ${interpolate(frame, [eventFrame, eventFrame + 7], [7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}px` }}>
      {event.side === "them" ? <Avatar person={person} size={27} /> : null}
      <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: event.side === "me" ? "18px 18px 5px 18px" : "18px 18px 18px 5px", background: event.side === "me" ? COLORS.accent : COLORS.bubble, color: event.side === "me" ? "#ffffff" : COLORS.ink, fontSize: 13, lineHeight: 1.48, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {event.text}
      </div>
    </div>
  );
}

function TypingIndicator({ frame }) {
  return (
    <div style={{ display: "flex", alignItems: "center", minHeight: 43, flex: "0 0 43px", padding: "0 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "11px 13px", borderRadius: "18px 18px 18px 5px", background: COLORS.bubble }}>
        {[0, 1, 2].map((index) => (
          <i key={index} style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: COLORS.muted, opacity: 0.35 + (Math.sin((frame / 8) + index * 0.7) + 1) * 0.3 }} />
        ))}
      </div>
    </div>
  );
}

function Composer() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 44, flex: "0 0 44px", margin: "0 10px 14px", padding: "4px 10px 4px 7px", border: "1px solid #e4e4df", borderRadius: 999, background: "#ffffff", boxShadow: "0 8px 25px rgba(30, 30, 22, .04)" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" stroke={COLORS.ink} strokeWidth="2" />
        <circle cx="8.5" cy="11.5" r="1.15" fill={COLORS.ink} />
        <circle cx="15.5" cy="11.5" r="1.15" fill={COLORS.ink} />
        <path d="M8.8 15.3c1.7 2.1 4.7 2.1 6.4 0" stroke={COLORS.ink} strokeLinecap="round" strokeWidth="2" />
      </svg>
      <div style={{ flex: 1, color: "#aaa9a5", fontSize: 13 }}>Message...</div>
      <div style={{ display: "grid", placeItems: "center", width: 29, height: 29, borderRadius: "50%", background: COLORS.accent, color: "#ffffff" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.513 3.576C21.826 2.552 20.617 2 19.384 2H4.621c-1.474 0-2.878.818-3.46 2.173-.6 1.398-.297 2.935.784 3.997l3.359 3.295a1 1 0 0 0 1.195.156l8.522-4.849a1 1 0 1 1 .988 1.738l-8.526 4.851a1 1 0 0 0-.477 1.104l1.218 5.038c.343 1.418 1.487 2.534 2.927 2.766.208.034.412.051.616.051 1.26 0 2.401-.644 3.066-1.763l7.796-13.118a3.572 3.572 0 0 0-.116-3.863Z" /></svg>
      </div>
    </div>
  );
}

function estimateMessageHeight(event) {
  const lines = Math.max(1, Math.ceil(event.text.length / 32));
  return 28 + lines * 19 + 28;
}

export function SaveTheConvoVideo({ person, conversation }) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const nowMs = (frame / fps) * 1_000;
  const messages = conversation.filter((event) => event.type === "message" && event.timestampMs <= nowMs);
  const thinking = conversation.find((event) => event.type === "thinking" && nowMs >= event.timestampMs && nowMs < event.timestampMs + event.durationMs);
  const messageHeight = messages.reduce((total, event) => total + estimateMessageHeight(event), 0) + 22;
  const bodyHeight = height - 14 - 72 - 43 - 58;
  const scrollOffset = Math.max(0, messageHeight - bodyHeight);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#ededeb", fontFamily: FONT, color: COLORS.ink }}>
      <div style={{ display: "flex", width: 390, height: 844, overflow: "hidden", flexDirection: "column", border: "7px solid #1b1b1a", borderRadius: 32, background: COLORS.canvas, boxShadow: "0 24px 55px rgba(30, 30, 25, .16)" }}>
        <Header person={person} />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "30px 12px" }}>
          <div style={{ translate: `0px ${-scrollOffset}px` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 22, margin: "3px 0 12px", color: COLORS.softMuted, fontSize: 10, fontWeight: 500 }}>9:41 AM</div>
            {messages.map((event, index) => <MessageRow key={`${event.timestampMs}-${index}`} event={event} person={person} frame={frame} fps={fps} />)}
          </div>
        </div>
        {thinking ? <TypingIndicator frame={frame} /> : <div style={{ flex: "0 0 43px", minHeight: 43 }} />}
        <Composer />
      </div>
    </AbsoluteFill>
  );
}
