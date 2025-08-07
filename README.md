<div align="center">
    <p align="center">
        <a href="https://nodejs.org/">
            <img src="https://avatars.githubusercontent.com/u/9950313?s=200&v=4" alt="Node.js logo" height="140">
        </a>
    </p>
</div>
<br>
<p align="center">
    <a href="https://github.com/berkanumutlu/challenge-nodejs-realtime-chat/stargazers" rel="nofollow"><img src="https://img.shields.io/github/stars/berkanumutlu/challenge-nodejs-realtime-chat?style=flat&logo=github" alt="Gerçek zamanlın Mesajlaşma Repo stars"></a>
    <a href="https://github.com/berkanumutlu/challenge-nodejs-realtime-chat/blob/master/LICENSE" target="_blank" rel="nofollow"><img src="https://img.shields.io/github/license/berkanumutlu/challenge-nodejs-realtime-chat" alt="License"></a>
    <a href="https://nodejs.org" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Node.js-v20.19.4-5FA04E?logo=nodedotjs&logoColor=white&labelColor=5FA04E" alt="Node.js Version"></a>
    <a href="https://expressjs.com" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Express.js-v5.1.0-black?logo=express&logoColor=white&labelColor=black" alt="Express.js Version"></a>
    <a href="https://mongoosejs.com" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Mongoose-v8.17.0-880000?logo=sequelize&logoColor=white&labelColor=880000" alt="Mongoose Version"></a>
    <a href="https://socket.io" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Socket.IO-v4.8.1-010101?logo=socketdotio&logoColor=white&labelColor=010101" alt="Socket.IO Version"></a>
     <a href="https://zod.dev" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/zod-v4.0.14-3E67B1?logo=zod&logoColor=white&labelColor=3E67B1" alt="zod Version"></a>
    <a href="https://www.jwt.io" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/jsonwebtokens-v9.0.2-black?logo=jsonwebtokens&logoColor=white&labelColor=black" alt="jsonwebtoken Version"></a>
     <a href="https://redis.js.org" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Redis-v5.7.0-FF4438?logo=redis&logoColor=white&labelColor=FF4438" alt="Redis Version"></a>
     <a href="https://github.com/node-cron/node-cron" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/nodecron-v4.2.1-lightgrey" alt="node-cron Version"></a>
    <a href="https://www.npmjs.com" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/NPM-v10.8.2-CB3837?logo=npm&logoColor=F7F7F7&labelColor=CB3837" alt="NPM Version"></a>
    <a href="https://www.docker.com" target="_blank" rel="nofollow"><img src="https://img.shields.io/badge/Docker-v4.36.0-2496ED?logo=docker&logoColor=white&labelColor=2496ED" alt="Docker Version"></a>
</p>


# [Challenge] Gerçek-zamanlı Mesajlaşma Sistemi

Bu proje kapsamında, kullanıcıların birbiriyle gerçek zamanlı mesajlaşabileceği basit bir kullanıcı sistemi geliştirilecektir. Sistem, modern web teknolojileri kullanılarak ölçeklenebilir ve performanslı bir yapıda tasarlanacaktır.

## Kurulum

**1)** Repoyu klonlayın

```shell
$ git clone https://github.com/berkanumutlu/challenge-nodejs-realtime-chat.git
```

Veya SSH ile

```shell
$ git clone git@github.com:berkanumutlu/challenge-nodejs-realtime-chat.git
```

Veya Github CLI ile

```shell
$ git clone gh repo clone berkanumutlu/challenge-nodejs-realtime-chat
```

**2)** .env.example dosyasını kopyalayın ve dosyada **gerekli yapılandırma değişikliklerini** yapın

```shell
$ cp /src/.env.example /src/.env
$ cp /.env.example /.env
```

**3)** Docker konteynerini yükleyin (Docker gerekiyor)

```shell
$ docker-compose up -d
```

**4)** Kurulumdan sonra, Docker'da API konteyner kimliğini bulun

```shell
$ docker ps

# Output:
CONTAINER ID   IMAGE                                COMMAND                  CREATED       STATUS          PORTS                                                                                                         NAMES
...
917282764ba7   challenge-nodejs-realtime-chat-api   "docker-entrypoint.s…"   3 hours ago   Up 31 minutes   0.0.0.0:3000->3000/tcp                                                                                        realtime-chat-api 
...
```

- Ve uygulamanın API konteyner terminaline bağlanın

```shell
$ docker exec -it {API_CONTAINER_ID} bash
```

**5)** Tüm bağımlılıkları npm kullanarak yükleyin

```shell
/user/local/api $ npm install
```

**6)** Docker konteynerini yeniden başlatın

```shell
$ docker-compose restart
```

**8)** Artık projeyi kullanmaya hazırsın

- Docker konteynerini durdurmak için aşağıdaki komutu kullan

```shell
$ docker-compose stop
```

## API

Bu bölüm, uygulamaya ait mevcut API uç noktalarına genel bir bakış sunar. Her uç noktanın işlevselliği, istek ayrıntıları ve örnek yanıtlar aşağıda yer almaktadır.

---

### 1. Kimlik Doğrulama

---

### 1.1. Kullanıcı Kaydı
- **URL**: `POST /auth/register`
- **Açıklama**: Yeni bir kullanıcı hesabı oluşturur.
- **Kimlik Doğrulama:** Gerekli değil.
- **İstek**:
  ```json
  {
    "email": "...",
    "username": "...",
    "password": "..."
  }
  ```
- **Başarılı Yanıt (201 Created)**:
  ```json
  {
    "success": true,
    "status": 201,
    "message": "User registered successfully",
    "data": {
        "accessToken": "...",
        "refreshToken": "..."
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Doğrulama hatası (geçersiz e-posta, kullanıcı adı veya şifre formatı).
  - `409 Conflict`: E-posta veya kullanıcı adı zaten kullanımda.

### 1.2. Kullanıcı Girişi
- **URL**: `POST /auth/login`
- **Açıklama**: Kullanıcının kimlik bilgilerini doğrulayarak erişim ve yenileme token'ları sağlar.
- **Kimlik Doğrulama:** Gerekli değil.
- **İstek**:
  ```json
  {
    "email": "...",
    "password": "..."
  }
  ```
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "User logged in successfully",
    "data": {
        "user": {
            "id": "...",
            "username": "...",
            "email": "...",
            "createdAt": "..."
        },
        "accessToken": "...",
        "refreshToken": "..."
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Doğrulama hatası (geçersiz e-posta veya şifre formatı).
  - `401 Unauthorized`: Kullanıcı bulunamadı veya geçersiz kimlik bilgileri.

### 1.3. Token Yenileme
- **URL**: `POST /auth/refresh`
- **Açıklama**: Kullanıcının kimlik bilgilerini doğrulayarak erişim ve yenileme token'ları sağlar.
- **Kimlik Doğrulama:** Gerekli değil.
- **İstek**:
  ```json
  {
    "refreshToken": "..."
  }
  ```
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Token renewed successfully",
    "data": {
        "accessToken": "...",
        "refreshToken": "..."
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Doğrulama hatası (yenileme token'ı eksik).
  - `401 Unauthorized`: Geçersiz veya süresi dolmuş yenileme token'ı.

### 1.4. Kullanıcı Çıkışı
- **URL**: `POST /auth/logout`
- **Açıklama**: Kullanıcının oturumunu sonlandırır ve mevcut erişim token'ını kara listeye alır.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "User logged out successfully",
    "data": null,
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.
  - `404 Not Found`: Kullanıcı bulunamadı.

### 1.5. Oturum Açmış Kullanıcı Bilgileri
- **URL**: `GET /auth/me`
- **Açıklama**: Oturum açmış kullanıcının bilgilerini döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "username": "...",
        "email": "...",
        "createdAt": "...",
        "id": "..."
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.
  - `404 Not Found`: Kullanıcı bulunamadı.


---

### 2. Kullanıcı

---

### 2.1. Kullanıcı Listesi
- **URL**: `GET /user/list`
- **Açıklama**: Sistemdeki aktif kullanıcıların (oturum açmış kullanıcı hariç) listesini sayfalama ile döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Sorgu Parametreleri (`Query Parameters`):**
  - `limit` (isteğe bağlı): Sayfa başına kullanıcı sayısı (varsayılan: 10).
  - `offset` (isteğe bağlı): Atlanacak kullanıcı sayısı (varsayılan: 0).
- **İstek**:
  ```json
  {
    "email": "...",
    "username": "...",
    "password": "..."
  }
  ```
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "meta": {
            "perPage": 10,
            "currentPage": 1,
            "lastPage": 2,
            "total": 17
        },
        "items": [
            {
                "username": "...",
                "email": "...",
                "createdAt": "...",
                "id": "..."
            },
            // ...
        ]
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

### 2.2. Kullanıcı Bilgilerini Güncelleme
- **URL**: `PUT /user/update`
- **Açıklama**: Oturum açmış kullanıcının bilgilerini günceller. Yalnızca sağlanan alanlar güncellenir.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **İstek**:
  ```json
  {
    "username": "..."
  }
  ```
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "User updated successfully",
    "data": {
        "username": "...",
        "email": "...",
        "createdAt": "...",
        "id": "..."
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Doğrulama hatası (geçersiz format veya kısıtlamalar).
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.
  - `409 Conflict`: Güncellenmeye çalışılan e-posta veya kullanıcı adı zaten kullanımda.

### 2.3. Çevrimiçi Kullanıcı Listesi
- **URL**: `GET /user/online/list`
- **Açıklama**: Şu anda çevrimiçi olan kullanıcıların ID'lerini veya detaylı bilgilerini döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Sorgu Parametreleri (`Query Parameters`):**
  - `limit` (isteğe bağlı): Sayfa başına kullanıcı sayısı (varsayılan: 0, yani tümü).
  - `offset` (isteğe bağlı): Atlanacak kullanıcı sayısı (varsayılan: 0).
  - `fetchUserDetails` (isteğe bağlı, boolean): `true` ise kullanıcıların detaylı bilgilerini döndürür, `false` ise sadece ID'lerini döndürür (varsayılan: `false`).
- **Başarılı Yanıt (200 OK)**:
  - `fetchUserDetails=false` (varsayılan) ise:
     ```json
     {
       "success": true,
       "status": 200,
       "message": "Success",
       "data": {
           "meta": {
               "perPage": 0,
               "currentPage": 1,
               "lastPage": 1,
               "total": 2
           },
           "items": [
               "...",
               "...",
               // ...
           ]
       },
       "errors": null,
       "date": "..."
     }
     ```
  - `fetchUserDetails=true` ise:
     ```json
     {
       "success": true,
       "status": 200,
       "message": "Success",
       "data": {
           "meta": {
               "perPage": 0,
               "currentPage": 1,
               "lastPage": 1,
               "total": 2
           },
           "items": [
               {
                "id": "...",
                "username": "...",
                "email": "...",
                "isActive": true,
                "createdAt": "..."
               }
               // ...
           ]
       },
       "errors": null,
       "date": "..."
     }
     ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

### 2.4. Çevrimiçi Kullanıcı Sayısı
- **URL**: `GET /user/online/count`
- **Açıklama**: Şu anda çevrimiçi olan kullanıcıların toplam sayısını döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "count": 5
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

### 2.5. Kullanıcının Çevrimiçi Durumu
- **URL**: `GET /user/online/is-online/:userId`
- **Açıklama**: Belirli bir kullanıcının çevrimiçi olup olmadığını kontrol eder.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Sorgu Parametreleri (`Query Parameters`):**
  - ``userId`` (gerekli): Kontrol edilecek kullanıcının ID'si.
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "userId": "...",
        "isOnline": true
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Geçersiz `userId` formatı.
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

---

### 3. Konuşma

---

### 3.1. Kullanıcının Konuşmalarını Listeleme
- **URL**: `GET /conversation/list`
- **Açıklama**: Oturum açmış kullanıcının dahil olduğu tüm konuşmaları sayfalama ile döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Sorgu Parametreleri (`Query Parameters`):**
  - `limit` (isteğe bağlı): Sayfa başına konuşma sayısı (varsayılan: 0, yani tümü).
  - `offset` (isteğe bağlı): Atlanacak konuşma sayısı (varsayılan: 0).
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "meta": {
            "perPage": 0,
            "currentPage": 1,
            "lastPage": 1,
            "total": 3
        },
        "items": [
            {
                "participants": [
                    {
                        "username": "...",
                        "email": "...",
                        "id": "..."
                    },
                    // ...
                ],
                "lastMessageId": "...",
                "createdAt": "...",
                "id": "..."
            },
            // ...
        ]
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

### 3.2. Konuşma Detayları ve Mesajları
- **URL**: `GET /conversation/get/:conversationId`
- **Açıklama**: Belirli bir konuşmanın detaylarını ve o konuşmadaki mesajları sayfalama ile döndürür.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Yol Parametreleri (`Path Parameters`):**
  - `conversationId` (gerekli): Detayları alınacak konuşmanın ID'si.
- **Sorgu Parametreleri (`Query Parameters`):**
  - `messageLimit` (isteğe bağlı): Sayfa başına mesaj sayısı (varsayılan: 0, yani tümü).
  - `messageOffset` (isteğe bağlı): Atlanacak mesaj sayısı (varsayılan: 0).
- **Başarılı Yanıt (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "message": "Success",
    "data": {
        "conversation": {
            "participants": [
                {
                    "username": "...",
                    "email": "...",
                    "id": "..."
                },
                // ...
            ],
            "lastMessageId": "...",
            "createdAt": "...",
            "id": "..."
        },
        "messages": {
            "meta": {
                "perPage": 0,
                "currentPage": 1,
                "lastPage": 1,
                "total": 10
            },
            "items": [
                {
                    "senderId": {
                        "username": "...",
                        "email": "...",
                        "id": "..."
                    },
                    "content": "...",
                    "deletedAt": null,
                    "readBy": [],
                    "createdAt": "...",
                    "id": "..."
                },
                // ...
            ]
        }
    },
    "errors": null,
    "date": "..."
  }
  ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Geçersiz `conversationId` formatı.
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.
  - `403 Forbidden`: Kullanıcı bu konuşmanın katılımcısı değil.
  - `404 Not Found`: Konuşma bulunamadı.

### 3.3. Yeni Konuşma Oluşturma
- **URL**: `POST /conversation/create`
- **Açıklama**: Yeni bir konuşma oluşturur. Eğer aynı katılımcılarla zaten bir konuşma varsa, mevcut konuşmayı döndürür. Oturum açmış kullanıcı otomatik olarak katılımcı olarak eklenir.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **İstek**:
  ```json
  {
    "participantIds": [
        "...",
        // ...
    ]
  }
  ```
- **Başarılı Yanıt (201 Created / 200 OK)**:
  - Yeni konuşma oluşturulduysa (201 Created):
     ```json
    {
      "success": true,
      "status": 201,
      "message": "Conversation created successfully",
      "data": {
          "participants": [
              "...",
              "...",
              // ...
          ],
          "lastMessageId": "...",
          "createdAt": "...",
          "id": "..."
      },
      "errors": null,
      "date": "..."
    }
     ```
  - Mevcut konuşma döndürüldüyse (200 OK):
     ```json
     {
       "success": true,
       "status": 200,
       "message": "Conversation already exists.",
       "data": {
           "participants": [
               {
                   "username": "...",
                   "email": "...",
                   "id": "..."
               },
               // ...
           ],
           "lastMessageId": "...",
           "createdAt": "...",
           "id": "..."
       },
       "errors": null,
       "date": "..."
     }
     ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Doğrulama hatası (geçersiz `participantIds` formatı, katılımcı sayısı 2'den az veya geçersiz/aktif olmayan katılımcı ID'leri).
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.

### 3.4. Konuşma Detayları ve Mesajları
- **URL**: `DELETE /conversation/leave/:conversationId`
- **Açıklama**: Oturum açmış kullanıcının belirli bir konuşmadan ayrılmasını sağlar. Eğer konuşmada sadece 2 katılımcı varsa, konuşma soft-delete edilir.
- **Kimlik Doğrulama:** Gerekli (JWT Access Token).
- **Yol Parametreleri (`Path Parameters`):**
  - `conversationId` (gerekli): Ayrılınacak konuşmanın ID'si.
- **Başarılı Yanıt (200 OK):**:
  - Konuşmadan başarıyla ayrıldıysa:
     ```json
    {
      "success": true,
      "status": 200,
      "message": "Successfully left the conversation",
      "data": {
          "participants": [
              "...",
              "...",
              // ...
          ],
          "lastMessageId": "...",
          "createdAt": "...",
          "id": "..."
      },
      "errors": null,
      "date": "..."
    }
     ```
  - Mevcut konuşma döndürüldüyse (200 OK):
     ```json
     {
      "success": true,
      "status": 200,
      "message": "Conversation closed successfully as you were the last participant",
      "data": null,
      "errors": null,
      "date": "..."
    }
    ```
- **Hata Yanıtları:**
  - `400 Bad Request`: Geçersiz `conversationId` formatı.
  - `401 Unauthorized`: Token sağlanmadı, geçersiz veya süresi dolmuş token.
  - `403 Forbidden`: Kullanıcı bu konuşmanın katılımcısı değil.
  - `404 Not Found`: Konuşma bulunamadı.
  - `500 Internal Server Error`: Konuşmadan ayrılırken bir hata oluştu.

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.