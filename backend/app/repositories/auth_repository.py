import sqlite3


USER_COLUMNS = (
    "id",
    "name",
    "avatar",
    "role",
    "joined_year",
    "is_superhost",
    "email",
    "email_verified",
    "auth_provider",
)
USER_FIELDS = ", ".join(USER_COLUMNS)


class AuthRepository:
    def get_user(self, database: sqlite3.Connection, user_id: int):
        return database.execute(
            f"SELECT {USER_FIELDS} FROM users WHERE id=?",
            (user_id,),
        ).fetchone()

    def recent_code_count(self, database: sqlite3.Connection, email: str, since: str) -> int:
        return database.execute(
            """SELECT COUNT(*) FROM email_verification_codes
            WHERE email=? AND datetime(created_at)>=datetime(?)""",
            (email, since),
        ).fetchone()[0]

    def create_challenge(
        self,
        database: sqlite3.Connection,
        challenge_id: str,
        email: str,
        code_hash: str,
        expires_at: str,
    ) -> None:
        database.execute(
            """INSERT INTO email_verification_codes(
            challenge_id,email,code_hash,expires_at
            ) VALUES (?,?,?,?)""",
            (challenge_id, email, code_hash, expires_at),
        )

    def delete_challenge(self, database: sqlite3.Connection, challenge_id: str) -> None:
        database.execute(
            "DELETE FROM email_verification_codes WHERE challenge_id=?", (challenge_id,)
        )

    def get_challenge(self, database: sqlite3.Connection, challenge_id: str, email: str):
        return database.execute(
            """SELECT * FROM email_verification_codes
            WHERE challenge_id=? AND email=?""",
            (challenge_id, email),
        ).fetchone()

    def record_attempt(self, database: sqlite3.Connection, challenge_id: str) -> None:
        database.execute(
            "UPDATE email_verification_codes SET attempts=attempts+1 WHERE challenge_id=?",
            (challenge_id,),
        )

    def consume_challenge(self, database: sqlite3.Connection, challenge_id: str, now: str) -> None:
        database.execute(
            "UPDATE email_verification_codes SET consumed_at=? WHERE challenge_id=?",
            (now, challenge_id),
        )

    def get_user_by_email(self, database: sqlite3.Connection, email: str):
        return database.execute(
            f"SELECT {USER_FIELDS} FROM users WHERE email=?", (email,)
        ).fetchone()

    def create_email_user(
        self, database: sqlite3.Connection, email: str, name: str, avatar: str, year: int
    ) -> int:
        cursor = database.execute(
            """INSERT INTO users(
            name,avatar,role,joined_year,is_superhost,email,email_verified,auth_provider,last_login_at
            ) VALUES (?,?,'guest',?,0,?,1,'email',CURRENT_TIMESTAMP)""",
            (name, avatar, year, email),
        )
        return cursor.lastrowid

    def mark_email_login(self, database: sqlite3.Connection, user_id: int) -> None:
        database.execute(
            """UPDATE users SET email_verified=1, auth_provider='email',
            last_login_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?""",
            (user_id,),
        )

    def create_session(
        self, database: sqlite3.Connection, user_id: int, token_hash: str, expires_at: str
    ) -> None:
        database.execute(
            "INSERT INTO auth_sessions(user_id,token_hash,expires_at) VALUES (?,?,?)",
            (user_id, token_hash, expires_at),
        )

    def user_for_session(self, database: sqlite3.Connection, token_hash: str, now: str):
        return database.execute(
            f"""SELECT {', '.join(f'u.{field}' for field in USER_COLUMNS)}
            FROM auth_sessions s JOIN users u ON u.id=s.user_id
            WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?""",
            (token_hash, now),
        ).fetchone()

    def revoke_session(self, database: sqlite3.Connection, token_hash: str, now: str) -> None:
        database.execute(
            "UPDATE auth_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL",
            (now, token_hash),
        )


auth_repository = AuthRepository()
