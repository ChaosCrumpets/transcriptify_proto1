export function WelcomeView() {
  console.log("Rendering WelcomeView");
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome to Transcriptify
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Select a report from the history panel on the left, or generate a new one to get started.
        </p>
        <div className="mt-8 text-5xl text-gray-300 dark:text-gray-600">
          🎬
        </div>
      </div>
    );
  }