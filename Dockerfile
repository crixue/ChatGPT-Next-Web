# docker build -t art.local:8081/docker-local/lingro-web:latest .
FROM ubuntu:20.04 as base

FROM base AS deps

ENV DEBIAN_FRONTEND=noninteractive

# 备份原有的 sources.list 文件
RUN mv /etc/apt/sources.list /etc/apt/sources.list.bak

RUN echo "\
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse\n\
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse\n\
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse\n\
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse\n\
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse\n\
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse\n\
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse\n\
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse\n\
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse\n\
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse" > /etc/apt/sources.list

RUN apt-get update && apt-get install -y tzdata

# 设置时区为上海
RUN ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN dpkg-reconfigure --frontend noninteractive tzdata

RUN apt-get install -y --no-install-recommends curl software-properties-common git proxychains
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g yarn

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn config set registry 'https://registry.npm.taobao.org/'
# 禁用 SSL 证书验证
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
# 在安装依赖之前禁用 yarn 的 SSL 证书验证
RUN yarn config set strict-ssl false

RUN yarn add package.json

FROM deps AS builder

ENV CODE=""

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM base AS runner
WORKDIR /app

ENV PROXY_URL=""
ENV OPENAI_API_KEY=""
ENV CODE=""
ENV PATH="/usr/bin:${PATH}"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

EXPOSE 3000

CMD if [ -n "$PROXY_URL" ]; then \
        export HOSTNAME="127.0.0.1"; \
        protocol=$(echo $PROXY_URL | cut -d: -f1); \
        host=$(echo $PROXY_URL | cut -d/ -f3 | cut -d: -f1); \
        port=$(echo $PROXY_URL | cut -d: -f3); \
        conf=/etc/proxychains.conf; \
        echo "strict_chain" > $conf; \
        echo "proxy_dns" >> $conf; \
        echo "remote_dns_subnet 224" >> $conf; \
        echo "tcp_read_time_out 15000" >> $conf; \
        echo "tcp_connect_time_out 8000" >> $conf; \
        echo "localnet 127.0.0.0/255.0.0.0" >> $conf; \
        echo "localnet ::1/128" >> $conf; \
        echo "[ProxyList]" >> $conf; \
        echo "$protocol $host $port" >> $conf; \
        cat /etc/proxychains.conf; \
        proxychains -f $conf node server.js; \
    else \
        node server.js; \
    fi

#CMD ["tail", "-f", "/dev/null"]