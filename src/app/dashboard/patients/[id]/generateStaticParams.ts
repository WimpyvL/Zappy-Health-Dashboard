// Generate static params for patient pages
export async function generateStaticParams() {
  // Return some sample patient IDs for static generation
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: 'sample' },
  ];
}
