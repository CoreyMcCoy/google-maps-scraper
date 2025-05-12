import GetListings from '@/components/GetListings';
import ScrapeMapsPosition from '@/components/ScrapeMapsPosition';

export default function Home() {
  return (
    <section>
      <GetListings />
      <ScrapeMapsPosition />
    </section>
  );
}
