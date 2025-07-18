n = int(input("请输入一个正整数"))
s = 1
for i in range(1,n+1):
    s = s*i
print(f"{n}的阶乘是{s}")