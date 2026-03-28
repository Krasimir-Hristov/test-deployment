'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Newspaper,
  ExternalLink,
  RefreshCw,
  Radio,
  FileDown,
} from 'lucide-react';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
  publishedAt: string;
}

interface NewsSource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  country: string;
}

type Tab = 'latest' | 'search' | 'sources';

const CATEGORIES = [
  'technology',
  'business',
  'science',
  'health',
  'sports',
  'entertainment',
];

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const [tab, setTab] = useState<Tab>('latest');
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('technology');
  const [error, setError] = useState('');

  const fetchLatest = async (cat: string = category) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${BACKEND_URL}/news/latest?category=${cat}&country=us`,
      );
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setError('Неуспешна връзка с бекенда. Уверете се, че сървърът работи.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${BACKEND_URL}/news/search?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setError('Неуспешна връзка с бекенда. Уверете се, че сървърът работи.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async (cat: string = category) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${BACKEND_URL}/news/sources?category=${cat}&language=en`,
      );
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      setError('Неуспешна връзка с бекенда. Уверете се, че сървърът работи.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const url = `${BACKEND_URL}/news/pdf?category=${category}&country=us`;
      window.open(url, '_blank');
    } catch {
      alert('Грешка при генериране на PDF');
    }
  };

  useEffect(() => {
    if (tab === 'latest') fetchLatest();
    if (tab === 'sources') fetchSources();
  }, [tab]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (tab === 'latest') fetchLatest(cat);
    if (tab === 'sources') fetchSources(cat);
  };

  return (
    <main className='min-h-screen bg-slate-100 p-4 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <header className='mb-10 text-center'>
          <h1 className='text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3'>
            <Newspaper className='w-9 h-9 text-blue-600' />
            Global News Portal
          </h1>
          <p className='text-slate-500 text-sm'>
            Powered by FastAPI + Next.js + NewsAPI.org
          </p>
        </header>

        {/* Tabs */}
        <div className='flex justify-center gap-2 mb-8'>
          {(
            [
              { id: 'latest', label: 'Последни новини' },
              { id: 'search', label: 'Търсене' },
              { id: 'sources', label: 'Източници' },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        {(tab === 'latest' || tab === 'sources') && (
          <div className='flex flex-wrap justify-center gap-2 mb-8'>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  category === cat
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar (only on search tab) */}
        {tab === 'search' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchSearch();
            }}
            className='relative max-w-2xl mx-auto mb-10'
          >
            <input
              type='text'
              placeholder='Търсете тема (напр. AI, climate, Ukraine)...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='w-full pl-12 pr-36 py-4 rounded-2xl bg-white text-slate-900 shadow ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all'
            />
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5' />
            <button
              type='submit'
              className='absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors'
            >
              Търси
            </button>
          </form>
        )}

        {/* Refresh button for latest */}
        {tab === 'latest' && (
          <div className='flex justify-end gap-4 mb-4'>
            <button
              onClick={() => downloadPDF()}
              className='flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm transition-colors'
            >
              <FileDown className='w-4 h-4' /> Свали PDF
            </button>
            <button
              onClick={() => fetchLatest()}
              className='flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm transition-colors'
            >
              <RefreshCw className='w-4 h-4' /> Опресни
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 text-center text-sm'>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='animate-pulse bg-white rounded-3xl h-80 shadow'
              />
            ))}
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            {(tab === 'latest' || tab === 'search') && (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {articles.length > 0 ? (
                  articles.map((article, i) => (
                    <article
                      key={i}
                      className='bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col group'
                    >
                      <div className='h-44 overflow-hidden relative bg-slate-200'>
                        {article.urlToImage && (
                          <img
                            src={article.urlToImage}
                            alt={article.title}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                          />
                        )}
                        <span className='absolute top-3 left-3 px-2 py-1 bg-blue-600/85 backdrop-blur-sm text-white text-xs font-bold rounded-lg'>
                          {article.source.name}
                        </span>
                      </div>
                      <div className='p-5 flex flex-col grow'>
                        <h3 className='font-bold text-slate-900 mb-2 line-clamp-2 text-base'>
                          {article.title}
                        </h3>
                        <p className='text-slate-500 text-sm line-clamp-3 grow mb-4'>
                          {article.description ?? 'Няма описание.'}
                        </p>
                        <div className='flex items-center justify-between mt-auto'>
                          <span className='text-xs text-slate-400'>
                            {new Date(article.publishedAt).toLocaleDateString(
                              'bg-BG',
                            )}
                          </span>
                          <a
                            href={article.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-800 text-sm'
                          >
                            Прочети <ExternalLink className='w-3.5 h-3.5' />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className='col-span-full text-center text-slate-400 py-20 italic'>
                    Няма намерени новини.
                  </p>
                )}
              </div>
            )}

            {/* Sources Grid */}
            {tab === 'sources' && (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                {sources.length > 0 ? (
                  sources.map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group'
                    >
                      <div className='flex items-start gap-3 mb-3'>
                        <Radio className='w-5 h-5 text-blue-500 mt-0.5 shrink-0' />
                        <h3 className='font-bold text-slate-800 group-hover:text-blue-600 transition-colors'>
                          {src.name}
                        </h3>
                      </div>
                      <p className='text-slate-500 text-sm line-clamp-3'>
                        {src.description}
                      </p>
                      <div className='flex gap-2 mt-3'>
                        <span className='px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full capitalize'>
                          {src.category}
                        </span>
                        <span className='px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full uppercase'>
                          {src.country}
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className='col-span-full text-center text-slate-400 py-20 italic'>
                    Няма намерени източници.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
