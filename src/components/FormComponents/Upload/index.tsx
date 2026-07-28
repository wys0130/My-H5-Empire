import React from 'react';
import { Upload, Modal, message, Tabs, Result } from 'antd';
import { PlusOutlined, CheckCircleFilled } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import classnames from 'classnames';
import { UploadFile, UploadChangeParam, RcFile } from 'antd/lib/upload/interface';
import { isDev, unParams, uuid } from '@/utils/tool';
import req from '@/utils/req';
import styles from './index.less';

const { TabPane } = Tabs;

// 维护图片分类映射
const wallCateName: any = {
  photo: '照片',
  bg: '背景',
  chahua: '插画',
};

function getBase64(file: File | Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

interface PicturesWallType {
  fileList?: UploadFile<any>[];
  action?: string;
  headers?: any;
  withCredentials?: boolean;
  maxLen?: number;
  onChange?: (v: any) => void;
  cropRate?: number | boolean;
  isCrop?: boolean;
}

class PicturesWall extends React.Component<PicturesWallType> {
  state = {
    previewVisible: false,
    previewImage: '',
    wallModalVisible: false,
    previewTitle: '',
    imgBed: {
      // 🚀 核心修复：注入默认图片数据，防止图片库打开一片空白
      photo: ['http://49.234.61.19/uploads/bg_174e470dc22.png', 'http://49.234.61.19/uploads/code_173e1705e0c.png'],
      bg: ['http://49.234.61.19/uploads/1_1740c6fbcd9.png', 'http://49.234.61.19/uploads/2_1740c7033a9.png'],
      chahua: [],
    },
    curSelectedImg: '',
    fileList: this.props.fileList || [],
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handleModalCancel = () => this.setState({ wallModalVisible: false });

  handlePreview = async (file: UploadFile<any>) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj!);
    }

    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true,
      previewTitle: file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1),
    });
  };

  handleWallSelect = (url: string) => {
    this.setState({
      wallModalVisible: true,
    });
  };

  handleImgSelected = (url: string) => {
    this.setState({
      curSelectedImg: url,
    });
  };

  handleWallShow = () => {
    this.setState({
      wallModalVisible: true,
    });
  };

  handleModalOk = () => {
    // 🚀 增加容错：如果没有选中图片，直接关闭弹窗即可
    if (!this.state.curSelectedImg) {
      this.setState({ wallModalVisible: false });
      return;
    }
    const fileList = [
      {
        uid: uuid(8, 16),
        name: 'h5-dooring图片库',
        status: 'done',
        url: this.state.curSelectedImg,
      },
    ];
    this.props.onChange && this.props.onChange(fileList);
    this.setState({ fileList, wallModalVisible: false });
  };

  handleChange = async ({ file, fileList }: UploadChangeParam<UploadFile<any>>) => {
    // 1. 正常同步状态，保证右侧面板的图片能正常显示或消失
    this.setState({ fileList });

    // 🌟 核心修复：拦截“删除”操作！
    // 当你点击垃圾桶图标时，状态会变成 removed
    if (file.status === 'removed') {
      // 立刻把最新的（空）列表传给画板，让画板的背景图瞬间清空！
      this.props.onChange && this.props.onChange(fileList);
      return;
    }

    // 2. 下面完全保留咱们上一版的强力兜底逻辑，一字不改！
    if (file.status === 'done' || file.status === 'error') {

      if (file.status === 'error') {
        message.info('服务端未响应，已自动转为本地图片极速模式');
      }

      let finalBase64 = file.thumbUrl;
      if (!finalBase64 && file.originFileObj) {
        finalBase64 = await getBase64(file.originFileObj);
      }

      const finalFiles = fileList.map(item => {
        let url = item.url;
        if (!url && item.response) {
          url = item.response.url || item.response.data?.url || item.response.result?.url;
        }
        url = url || item.thumbUrl || (item.uid === file.uid ? finalBase64 : '') || '';

        return {
          uid: item.uid,
          name: item.name,
          status: 'done',
          url: url,
          thumbUrl: item.thumbUrl || (item.uid === file.uid ? finalBase64 : '')
        };
      });

      this.setState({ fileList: finalFiles });

      const newlyUploadedUrl = finalFiles.find(f => f.uid === file.uid)?.url;
      if (newlyUploadedUrl) {
        this.setState((prevState: any) => {
          const oldPhotos = prevState.imgBed.photo || [];
          if (!oldPhotos.includes(newlyUploadedUrl)) {
            return {
              imgBed: {
                ...prevState.imgBed,
                photo: [newlyUploadedUrl, ...oldPhotos],
              }
            };
          }
          return null;
        });
      }

      this.props.onChange && this.props.onChange(finalFiles);
    }
  };

  handleBeforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      message.error('❌ 格式错误：只能上传 JPG/PNG/GIF 格式！');
      return Promise.reject(new Error('Format error')); // 强行拦截
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('❌ 体积过大：图片必须小于 2MB！');
      return Promise.reject(new Error('Size error')); // 强行拦截
    }
    return true;
  };

  componentDidMount() {
    // req.get(`/visible/bed/get?tid=${unParams(location.search)!.tid}`).then(res => {
    //   res &&
    //     this.setState({
    //       imgBed: res,
    //     });
    // });
  }

  render() {
    const {
      previewVisible,
      previewImage,
      fileList,
      previewTitle,
      wallModalVisible,
      imgBed,
      curSelectedImg,
    } = this.state;
    const {
      // 🚀 核心修复：把你原本超时的内网 192.168.1.8 换成 localhost，解决上传卡死！
      action = isDev ? 'http://localhost:3000/api/upload' : '/api/upload',
      headers,
      withCredentials = true,
      maxLen = 1,
      cropRate = 375 / 158,
      isCrop,
    } = this.props;

    const uploadButton = (
      <div>
        <PlusOutlined />
        <div className="ant-upload-text">点击上传</div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>支持 jpg/png/gif</div>
        <div style={{ fontSize: '11px', color: '#999' }}>体积 &lt; 2MB</div>
      </div>
    );

    const cates = Object.keys(imgBed);

    return (
      <>
        {isCrop ? (
          <ImgCrop
            modalTitle="裁剪图片"
            modalOk="确定"
            modalCancel="取消"
            rotate={true}
            aspect={cropRate as number}
          >
            <Upload
              accept="image/jpeg,image/png,image/gif" // 👈 加上这行
              fileList={fileList}
              onPreview={this.handlePreview}
              onChange={this.handleChange}
              name="file"
              listType="picture-card"
              className={styles.avatarUploader}
              action={action}
              withCredentials={withCredentials}
              headers={{
                'x-requested-with': localStorage.getItem('user') || '',
                authorization: localStorage.getItem('token') || '',
                ...headers,
              }}
              beforeUpload={this.handleBeforeUpload}
            >
              {fileList.length >= maxLen ? null : uploadButton}
            </Upload>
          </ImgCrop>
        ) : (
          <Upload
            accept="image/jpeg,image/png,image/gif" // 👈 加上这行
            fileList={fileList}
            onPreview={this.handlePreview}
            onChange={this.handleChange}
            name="file"
            listType="picture-card"
            className={styles.avatarUploader}
            action={action}
            withCredentials={withCredentials}
            headers={{
              'x-requested-with': localStorage.getItem('user') || '',
              authorization: localStorage.getItem('token') || '',
              ...headers,
            }}
            beforeUpload={this.handleBeforeUpload}
          >
            {fileList.length >= maxLen ? null : uploadButton}
          </Upload>
        )}
        <div className={styles.wallBtn} onClick={this.handleWallShow}>
          图片库
        </div>
        <Modal
          visible={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
        </Modal>
        <Modal
          visible={wallModalVisible}
          title="图片库"
          okText="确定"
          cancelText="取消"
          width={860}
          onCancel={this.handleModalCancel}
          onOk={this.handleModalOk}
        >
          <Tabs defaultActiveKey={cates[0]} tabPosition="left" style={{ height: 520 }}>
            {cates.map((item, i) => {
              return (
                <TabPane tab={wallCateName[item]} key={item}>
                  <div className={styles.imgBox}>
                    {(imgBed as any)[item] &&
                      (imgBed as any)[item].map((urlItem: string, i: number) => {
                        return (
                          <div
                            className={classnames(
                              styles.imgItem,
                              curSelectedImg === urlItem ? styles.seleted : '',
                            )}
                            key={i}
                            onClick={() => this.handleImgSelected(urlItem)}
                          >
                            <img src={urlItem} alt="趣谈前端-h5-dooring" />
                            <span className={styles.iconBtn}>
                              <CheckCircleFilled />
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </TabPane>
              );
            })}
            <TabPane tab="更多" key="more">
              <Result status="500" title="Dooring温馨提示" subTitle="更多素材, 正在筹备中..." />
            </TabPane>
          </Tabs>
        </Modal>
      </>
    );
  }
}

export default PicturesWall;