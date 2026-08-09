-- UI development data only. These rows are not claims about real official announcements.
insert into public.events (
  title, category, start_at, end_at, all_day, participants, display_color,
  location, summary, source_url, source_channel, source_published_at, status, external_id
) values
  ('히나 생일 이벤트', 'goods', '2026-08-12T00:00:00+09:00', null, true, ARRAY['시라유키 히나'], '#FF4A60', null, '개발용 예시 행사입니다.', 'https://stellive.me/news/example-hina', 'official-site', '2026-08-01T09:00:00+09:00', 'verified', 'example-hina'),
  ('STELLIVE 팝업스토어', 'offline', '2026-08-14T00:00:00+09:00', '2026-08-16T23:59:59+09:00', true, ARRAY['스텔라이브 단체'], '#8C6CFF', '서울', '개발용 예시 기간 행사입니다.', 'https://stellive.me/news/example-popup', 'official-site', '2026-08-01T09:00:00+09:00', 'verified', 'example-popup'),
  ('타비 오프라인 사인회', 'offline', '2026-08-18T00:00:00+09:00', null, true, ARRAY['아라하시 타비'], '#64BCFF', null, '개발용 예시 행사입니다.', 'https://stellive.me/news/example-tabi', 'official-site', '2026-08-01T09:00:00+09:00', 'verified', 'example-tabi'),
  ('마시로 굿즈 예약 오픈', 'goods', '2026-08-19T00:00:00+09:00', null, true, ARRAY['네네코 마시로'], '#B3B3B3', null, '개발용 예시 행사입니다.', 'https://stellive.me/news/example-mashiro', 'official-site', '2026-08-01T09:00:00+09:00', 'verified', 'example-mashiro'),
  ('강지 팬미팅', 'performance', '2026-08-08T00:00:00+09:00', null, true, ARRAY['강지'], '#8282B7', null, '개발용 예시 행사입니다.', 'https://stellive.me/news/example-kangji', 'official-site', '2026-08-01T09:00:00+09:00', 'verified', 'example-kangji');
