import Link from 'next/link';

export default function NotFound() {
  return (
    <section>
      <div className="container max-w-5xl mx-auto text-center">
        <img src="/website99-404.png" alt="404 Not Found" className="w-full md:w-2/4 mx-auto" />
        <h1 className="text-6xl tracking-tight font-black pb-6">Looks like you got lost.</h1>
        <p className="mb-10">
          Or the page you are looking for doesn't exist. Please check the URL or go back to the home
          page.
        </p>
        <button className="bg-black text-white px-4 py-2 rounded-md">
          <Link href="/">Back to the home page</Link>
        </button>
      </div>
    </section>
  );
}
