export function log(message: string, ...args: any[]) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // If the last argument is a string and args length is 1, treat it as source (backward compatibility)
  const hasSource = args.length === 1 && typeof args[0] === "string" && !message.includes("{");
  const source = hasSource ? args[0] : "express";
  const extraArgs = hasSource ? [] : args;

  if (extraArgs.length > 0) {
    console.log(`${formattedTime} [${source}] ${message}`, ...extraArgs);
  } else {
    console.log(`${formattedTime} [${source}] ${message}`);
  }
}

