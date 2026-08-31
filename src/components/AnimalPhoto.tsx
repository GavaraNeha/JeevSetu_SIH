import { getSpeciesPhoto, getSpeciesLabel } from '@/lib/species';
import type { Language } from '@/types/db';

interface Props {
  species: string;
  breed?: string | null;
  photoUrl?: string | null;
  name?: string | null;
  tag?: string | null;
  lang: Language;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimalPhoto({
  species,
  breed,
  photoUrl,
  name,
  tag,
  lang,
  onClick,
  size = 'md',
}: Props) {
  const photo = photoUrl || getSpeciesPhoto(species);
  const label = getSpeciesLabel(species, lang);

  const sizeClasses = {
    sm: 'w-12 h-12 rounded-lg',
    md: 'w-16 h-16 rounded-xl',
    lg: 'w-24 h-24 rounded-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''} group`}
    >
      <img
        src={photo}
        alt={name || label}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {tag && (
        <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold text-white bg-black/50 rounded px-1 py-0.5">
          {tag}
        </span>
      )}
    </div>
  );
}

export function AnimalCardPhoto({
  species,
  breed,
  photoUrl,
  name,
  tag,
  lang,
  onClick,
  status,
}: Props & { status?: string }) {
  const photo = photoUrl || getSpeciesPhoto(species);
  const label = getSpeciesLabel(species, lang);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} group h-40 w-full`}
    >
      <img
        src={photo}
        alt={name || label}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
        <div>
          <p className="text-white font-semibold text-sm leading-tight drop-shadow">{name || label}</p>
          <p className="text-white/80 text-xs drop-shadow">{breed || label}</p>
        </div>
        {tag && (
          <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
