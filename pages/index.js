import Link from 'next/link'

export default function IndexPage() {
  return (
    <div className="main">
      <Link href="/birds">
        <a>ignore</a>
      </Link>
      <Link href="/boxes">
        <a>shadereffect</a>
      </Link>
    </div>
  )
}
