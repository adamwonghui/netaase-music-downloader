# 寻找1000以内的完数
# 完数是指一个数的所有因子之和等于本身的数。例如，6 = 1 +2 +3，所以6是完数。
for i in range(2, 1001):
    sum = 0
    for j in range(1, i):
        if i % j == 0:
            sum += j
    if sum == i:
        print(f"{i}是完数")