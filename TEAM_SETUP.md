# GLINK ONE — チーム共有の有効化手順

現在の公開URLは画面を配信していますが、GitHub Pages単独では社員間のデータ同期・ログイン管理はできません。Supabaseの会社承認済みプロジェクトが必要です。

1. Supabaseでプロジェクトを作成し、SQL Editorで `setup_supabase.sql` を実行します。
2. SQL Editorで `insert into public.teams(name) values ('富谷店') returning id;` を実行し、表示されたUUIDを控えます。
3. Auth > Usersから本人宛のメール招待を8名に送り、各自がパスワードを設定します。本人以外にパスワードを配布・共有しないでください。
4. 管理者がSQL Editorで各ユーザーUUIDに対応した `team_members` レコードを登録します。役割は管理者3名に `admin`、その他5名に `member` を指定します。GLK001〜GLK008は社員識別子でありログインIDそのものではありません。
5. 機密情報を除いた、アプリのJSONバックアップを作成します。SQL Editorで `insert into public.team_states(team_id,payload) values ('＜チームUUID＞','＜JSONバックアップ＞'::jsonb);` を実行します。
6. アプリの「共有」にSupabase Project URL、publishable/anonキー、チームUUIDを入力し、ユーザー本人がメールアドレス・パスワードでログインします。**service_role/secretキーをブラウザに絶対に入れないでください。**
7. 管理者2端末で競合を試し、スタッフ端末で閲覧のみであることを確認します。

## 現在の制限
- 一般スタッフは閲覧のみ。自分の日報・実績の編集機能は未実装です。
- チーム全体を1つのJSONで保存。競合時に自動マージしません。
- 店舗の目標や実績の本番投入前に会社承認と情報セキュリティ確認が必要です。
- Supabaseで実際のプロジェクトを作る操作、メール招待、パスワード発行はこのGitHub更新では行っていません。
