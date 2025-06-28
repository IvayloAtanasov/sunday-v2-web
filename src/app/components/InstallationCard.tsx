import Link from 'next/link'

type Props = {
  slug: string
  title: string
  image: string
}

export default function InstallationCard({ slug, title, image }: Props) {
  return (
    <Link
      href={`/installations/${slug}`}
      className="block rounded-lg overflow-hidden shadow hover:shadow-lg transition duration-200 bg-white"
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
    </Link>
  )
}
