export default function PixioHome() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full">{/* Leave room for any global header */}
      <iframe
        src="https://beta.pixio.myapps.ai"
        title="Pixio"
        className="h-full w-full border-0"
        allow="clipboard-write; camera; microphone; fullscreen"
      />
    </div>
  );
}
