import Link from 'next/link'

export default function IndexPage() {
  return (
    <div className="main">
      <Link href="/birds">
        <a>Birds</a>
      </Link>
      <Link href="/gallery">
        <a>Gallery</a>
      </Link>
    </div>
  )
}
