// The Fetch API has no upload-progress event — only XMLHttpRequest does.
// This wraps XHR behind a fetch()-compatible signature so it can be
// dropped into Supabase's client as a custom `global.fetch`, letting
// uploadToSignedUrl() do its normal URL/FormData/header handling while
// this only swaps the transport underneath it.
export function fetchWithProgress(
  onProgress: (fraction: number) => void
): typeof fetch {
  return (input, init) =>
    new Promise<Response>((resolve, reject) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const xhr = new XMLHttpRequest();
      xhr.open(init?.method ?? "GET", url, true);
      xhr.responseType = "text";

      const headers = init?.headers;
      const headerEntries =
        headers instanceof Headers
          ? Array.from(headers.entries())
          : Array.isArray(headers)
            ? headers
            : Object.entries(headers ?? {});
      for (const [key, value] of headerEntries) {
        xhr.setRequestHeader(key, value as string);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };

      xhr.onload = () => {
        const responseHeaders = new Headers();
        for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
          const [key, ...rest] = line.split(": ");
          if (key) responseHeaders.set(key, rest.join(": "));
        }
        resolve(
          new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: responseHeaders,
          })
        );
      };
      xhr.onerror = () => reject(new TypeError("Network request failed"));

      xhr.send((init?.body ?? null) as XMLHttpRequestBodyInit | null);
    });
}
