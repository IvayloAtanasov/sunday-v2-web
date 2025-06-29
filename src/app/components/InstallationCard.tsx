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
      <img src={image} alt={title} className="w-full h-64 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
    </Link>
  )
}
